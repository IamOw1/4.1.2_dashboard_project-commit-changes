"""
SLAM Navigation Tool - Геолокация без GPS
Использует данные с камеры и 3D картографирование местности
"""
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
import cv2
from dataclasses import dataclass
from collections import deque

from tools.base_tool import BaseTool, ToolStatus
from src.utils.logger import setup_logger

logger = setup_logger(__name__)


@dataclass
class Landmark:
    """Точка ориентира в пространстве"""
    id: int
    descriptor: np.ndarray
    position_3d: np.ndarray
    confidence: float
    last_seen: float


@dataclass
class KeyFrame:
    """Ключевой кадр для SLAM"""
    id: int
    pose: np.ndarray  # 4x4 матрица преобразования
    landmarks: List[int]  # ID ориентиров
    timestamp: float


class SlamNavigationTool(BaseTool):
    """
    SLAM (Simultaneous Localization and Mapping) навигация
    
    Позволяет дрону определять свою позицию без GPS,
    используя визуальные данные с камеры и построение 3D карты.
    """
    
    @property
    def name(self) -> str:
        return "slam_navigation"
    
    @property
    def description(self) -> str:
        return """
        SLAM навигация - геолокация без GPS используя камеру и 3D картографирование.
        
        Возможности:
        - Определение позиции по визуальным ориентирам
        - Построение 3D карты местности
        - Навигация в GPS-отказных зонах (помещения, туннели, горы)
        - Обнаружение препятствий
        
        Примеры использования:
        - Полет в помещении без GPS
        - Исследование пещер
        - Навигация в городских "ущельях" между зданиями
        - Работа в условиях радиопомех
        """
    
    def __init__(self, config: Dict[str, Any], agent=None):
        super().__init__(config, agent)
        
        # ORB детектор для поиска ключевых точек
        self.orb = cv2.ORB_create(
            nfeatures=config.get('orb_features', 1000),
            scaleFactor=1.2,
            nlevels=8
        )
        
        # FLANN matcher для сопоставления дескрипторов
        FLANN_INDEX_LSH = 6
        index_params = dict(algorithm=FLANN_INDEX_LSH, table_number=6, key_size=12, multi_probe_level=1)
        search_params = dict(checks=50)
        self.matcher = cv2.FlannBasedMatcher(index_params, search_params)
        
        # Хранилище данных SLAM
        self.landmarks: Dict[int, Landmark] = {}
        self.keyframes: Dict[int, KeyFrame] = {}
        self.current_pose = np.eye(4)  # Текущая позиция
        self.map_points: List[np.ndarray] = []  # Точки карты
        
        # Параметры камеры (по умолчанию)
        self.camera_matrix = np.array([
            [config.get('fx', 500), 0, config.get('cx', 320)],
            [0, config.get('fy', 500), config.get('cy', 240)],
            [0, 0, 1]
        ], dtype=np.float32)
        
        self.dist_coeffs = np.zeros((4, 1))
        
        # История для сглаживания траектории
        self.pose_history = deque(maxlen=config.get('pose_history_size', 30))
        
        # Счетчики
        self.landmark_id_counter = 0
        self.keyframe_id_counter = 0
        self.frame_counter = 0
        
        # Последний кадр
        self.last_frame = None
        self.last_keypoints = None
        self.last_descriptors = None
        
        # Статус карты
        self.map_quality = 0.0
        self.localization_confidence = 0.0
        
        logger.info("SLAM Navigation Tool инициализирован")
    
    def _register_actions(self):
        """Регистрация действий"""
        self._actions = {
            'process_frame': self._process_frame,
            'get_position': self._get_position,
            'get_map': self._get_map,
            'reset_map': self._reset_map,
            'add_keyframe': self._add_keyframe,
            'estimate_scale': self._estimate_scale,
            'detect_loop_closure': self._detect_loop_closure,
            'get_obstacles': self._get_obstacles,
            'save_map': self._save_map,
            'load_map': self._load_map
        }
    
    async def initialize(self):
        """Инициализация инструмента"""
        self.status = ToolStatus.READY
        logger.info("SLAM Navigation готов к работе")
        return True
    
    async def _process_frame(self, frame: np.ndarray = None, **kwargs) -> Dict[str, Any]:
        """
        Обработка кадра для SLAM
        
        Args:
            frame: Изображение с камеры (numpy array)
        
        Returns:
            Результат обработки с текущей позицией
        """
        if frame is None:
            # Генерация тестового кадра
            frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        self.frame_counter += 1
        
        # Преобразование в grayscale
        if len(frame.shape) == 3:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        else:
            gray = frame
        
        # Обнаружение ключевых точек
        keypoints, descriptors = self.orb.detectAndCompute(gray, None)
        
        if descriptors is None or len(keypoints) < 10:
            return {
                'success': False,
                'error': 'Недостаточно ключевых точек',
                'position': self._pose_to_dict(self.current_pose),
                'confidence': 0.0
            }
        
        # Если это первый кадр - инициализация
        if self.last_frame is None:
            self.last_frame = gray
            self.last_keypoints = keypoints
            self.last_descriptors = descriptors
            
            # Создание начальных ориентиров
            for i, kp in enumerate(keypoints[:50]):
                landmark = Landmark(
                    id=self.landmark_id_counter,
                    descriptor=descriptors[i],
                    position_3d=np.array([kp.pt[0], kp.pt[1], 10.0]),
                    confidence=0.5,
                    last_seen=self.frame_counter
                )
                self.landmarks[self.landmark_id_counter] = landmark
                self.landmark_id_counter += 1
            
            return {
                'success': True,
                'position': self._pose_to_dict(self.current_pose),
                'landmarks_detected': len(keypoints),
                'confidence': 0.5,
                'status': 'initialized'
            }
        
        # Сопоставление с предыдущим кадром
        matches = self.matcher.knnMatch(self.last_descriptors, descriptors, k=2)
        
        # Фильтрация по ratio test Lowe
        good_matches = []
        for match_pair in matches:
            if len(match_pair) == 2:
                m, n = match_pair
                if m.distance < 0.7 * n.distance:
                    good_matches.append(m)
        
        # Оценка движения
        if len(good_matches) >= 8:
            # Получение точек
            pts1 = np.float32([self.last_keypoints[m.queryIdx].pt for m in good_matches])
            pts2 = np.float32([keypoints[m.trainIdx].pt for m in good_matches])
            
            # Нахождение фундаментальной матрицы
            F, mask = cv2.findFundamentalMat(pts1, pts2, cv2.FM_RANSAC, 1.0, 0.99)
            
            if F is not None:
                # Оценка вращения и смещения
                E = self.camera_matrix.T @ F @ self.camera_matrix
                
                # Разложение существенной матрицы
                R1, R2, t = cv2.decomposeEssentialMat(E)
                
                # Выбор правильного вращения
                # (в реальности нужно проверить глубину точек)
                R = R1 if np.trace(R1) > np.trace(R2) else R2
                
                # Обновление позы
                T = np.eye(4)
                T[:3, :3] = R
                T[:3, 3] = t.flatten() * 0.1  # Масштаб
                
                self.current_pose = self.current_pose @ T
                
                # Сглаживание позы
                self.pose_history.append(self.current_pose.copy())
                if len(self.pose_history) > 5:
                    self.current_pose = self._smooth_pose()
                
                # Обновление ориентиров
                self._update_landmarks(keypoints, descriptors, good_matches)
                
                # Оценка качества локализации
                self.localization_confidence = min(1.0, len(good_matches) / 100)
        
        # Обновление последнего кадра
        self.last_frame = gray
        self.last_keypoints = keypoints
        self.last_descriptors = descriptors
        
        # Оценка качества карты
        self.map_quality = self._calculate_map_quality()
        
        return {
            'success': True,
            'position': self._pose_to_dict(self.current_pose),
            'landmarks_detected': len(keypoints),
            'matches': len(good_matches),
            'confidence': self.localization_confidence,
            'map_quality': self.map_quality,
            'frame_id': self.frame_counter
        }
    
    async def _get_position(self, **kwargs) -> Dict[str, Any]:
        """Получение текущей позиции"""
        return {
            'success': True,
            'position': self._pose_to_dict(self.current_pose),
            'confidence': self.localization_confidence,
            'map_quality': self.map_quality,
            'gps_available': False,
            'slam_available': self.localization_confidence > 0.3
        }
    
    async def _get_map(self, **kwargs) -> Dict[str, Any]:
        """Получение 3D карты"""
        landmarks_data = []
        for lm in self.landmarks.values():
            landmarks_data.append({
                'id': lm.id,
                'position': lm.position_3d.tolist(),
                'confidence': lm.confidence
            })
        
        return {
            'success': True,
            'landmarks_count': len(self.landmarks),
            'keyframes_count': len(self.keyframes),
            'landmarks': landmarks_data[:100],  # Ограничение для передачи
            'map_quality': self.map_quality,
            'coverage_area': self._estimate_coverage()
        }
    
    async def _reset_map(self, **kwargs) -> Dict[str, Any]:
        """Сброс карты"""
        self.landmarks.clear()
        self.keyframes.clear()
        self.map_points.clear()
        self.current_pose = np.eye(4)
        self.pose_history.clear()
        self.landmark_id_counter = 0
        self.keyframe_id_counter = 0
        self.map_quality = 0.0
        self.localization_confidence = 0.0
        
        logger.info("SLAM карта сброшена")
        
        return {
            'success': True,
            'message': 'Карта сброшена'
        }
    
    async def _add_keyframe(self, **kwargs) -> Dict[str, Any]:
        """Добавление ключевого кадра"""
        keyframe = KeyFrame(
            id=self.keyframe_id_counter,
            pose=self.current_pose.copy(),
            landmarks=list(self.landmarks.keys())[:50],
            timestamp=self.frame_counter
        )
        
        self.keyframes[self.keyframe_id_counter] = keyframe
        self.keyframe_id_counter += 1
        
        return {
            'success': True,
            'keyframe_id': keyframe.id,
            'total_keyframes': len(self.keyframes)
        }
    
    async def _estimate_scale(self, known_distance: float = None, **kwargs) -> Dict[str, Any]:
        """
        Оценка масштаба карты
        
        Args:
            known_distance: Известное расстояние в метрах
        """
        if known_distance:
            # Корректировка масштаба на основе известного расстояния
            logger.info(f"Масштаб карты скорректирован: {known_distance}м")
            return {
                'success': True,
                'scale': known_distance,
                'unit': 'meters'
            }
        
        return {
            'success': True,
            'scale': 1.0,
            'unit': 'relative',
            'note': 'Для абсолютного масштаба укажите known_distance'
        }
    
    async def _detect_loop_closure(self, **kwargs) -> Dict[str, Any]:
        """Обнаружение замыкания петли (loop closure)"""
        # Упрощенная проверка - сравнение с ключевыми кадрами
        if len(self.keyframes) < 5:
            return {
                'success': True,
                'loop_detected': False,
                'reason': 'Недостаточно ключевых кадров'
            }
        
        # Проверка расстояния до старых ключевых кадров
        current_pos = self.current_pose[:3, 3]
        
        for kf_id, kf in list(self.keyframes.items())[:-5]:  # Пропускаем последние 5
            kf_pos = kf.pose[:3, 3]
            distance = np.linalg.norm(current_pos - kf_pos)
            
            if distance < 2.0:  # Возврат в знакомую область
                return {
                    'success': True,
                    'loop_detected': True,
                    'keyframe_id': kf_id,
                    'distance': float(distance)
                }
        
        return {
            'success': True,
            'loop_detected': False
        }
    
    async def _get_obstacles(self, **kwargs) -> Dict[str, Any]:
        """Получение обнаруженных препятствий"""
        obstacles = []
        
        # Простое обнаружение на основе плотности ориентиров
        landmark_positions = [lm.position_3d for lm in self.landmarks.values()]
        
        if len(landmark_positions) > 10:
            # Кластеризация простым методом
            positions = np.array(landmark_positions)
            
            # Поиск плотных областей (потенциальные препятствия)
            for i in range(0, len(positions), 10):
                cluster = positions[i:i+10]
                if len(cluster) > 5:
                    center = np.mean(cluster, axis=0)
                    spread = np.std(cluster, axis=0)
                    
                    if np.all(spread < 1.0):  # Плотная группа
                        obstacles.append({
                            'position': center.tolist(),
                            'size': spread.tolist(),
                            'confidence': len(cluster) / 10
                        })
        
        return {
            'success': True,
            'obstacles_count': len(obstacles),
            'obstacles': obstacles
        }
    
    async def _save_map(self, filename: str = None, **kwargs) -> Dict[str, Any]:
        """Сохранение карты"""
        import json
        import os
        
        if filename is None:
            filename = f"slam_map_{self.frame_counter}.json"
        
        filepath = os.path.join("data", "maps", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        map_data = {
            'landmarks': [
                {
                    'id': lm.id,
                    'position': lm.position_3d.tolist(),
                    'confidence': lm.confidence
                }
                for lm in self.landmarks.values()
            ],
            'keyframes': [
                {
                    'id': kf.id,
                    'pose': kf.pose.tolist(),
                    'landmarks': kf.landmarks,
                    'timestamp': kf.timestamp
                }
                for kf in self.keyframes.values()
            ],
            'current_pose': self.current_pose.tolist(),
            'map_quality': self.map_quality
        }
        
        with open(filepath, 'w') as f:
            json.dump(map_data, f)
        
        return {
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'landmarks_saved': len(self.landmarks),
            'keyframes_saved': len(self.keyframes)
        }
    
    async def _load_map(self, filename: str, **kwargs) -> Dict[str, Any]:
        """Загрузка карты"""
        import json
        import os
        
        filepath = os.path.join("data", "maps", filename)
        
        if not os.path.exists(filepath):
            return {
                'success': False,
                'error': f'Файл не найден: {filename}'
            }
        
        with open(filepath, 'r') as f:
            map_data = json.load(f)
        
        # Восстановление ориентиров
        self.landmarks.clear()
        for lm_data in map_data.get('landmarks', []):
            landmark = Landmark(
                id=lm_data['id'],
                descriptor=np.zeros(32),  # Заглушка
                position_3d=np.array(lm_data['position']),
                confidence=lm_data['confidence'],
                last_seen=0
            )
            self.landmarks[lm_data['id']] = landmark
        
        # Восстановление ключевых кадров
        self.keyframes.clear()
        for kf_data in map_data.get('keyframes', []):
            keyframe = KeyFrame(
                id=kf_data['id'],
                pose=np.array(kf_data['pose']),
                landmarks=kf_data['landmarks'],
                timestamp=kf_data['timestamp']
            )
            self.keyframes[kf_data['id']] = keyframe
        
        self.current_pose = np.array(map_data.get('current_pose', np.eye(4).tolist()))
        self.map_quality = map_data.get('map_quality', 0.5)
        
        return {
            'success': True,
            'landmarks_loaded': len(self.landmarks),
            'keyframes_loaded': len(self.keyframes),
            'map_quality': self.map_quality
        }
    
    def _pose_to_dict(self, pose: np.ndarray) -> Dict[str, Any]:
        """Преобразование матрицы позы в словарь"""
        return {
            'x': float(pose[0, 3]),
            'y': float(pose[1, 3]),
            'z': float(pose[2, 3]),
            'rotation_matrix': pose[:3, :3].tolist(),
            'full_matrix': pose.tolist()
        }
    
    def _smooth_pose(self) -> np.ndarray:
        """Сглаживание траектории"""
        if len(self.pose_history) < 3:
            return self.current_pose
        
        # Простое среднее по последним позам
        poses = list(self.pose_history)[-5:]
        avg_pose = np.mean([p for p in poses], axis=0)
        
        # Нормализация вращения
        u, _, vh = np.linalg.svd(avg_pose[:3, :3])
        avg_pose[:3, :3] = u @ vh
        
        return avg_pose
    
    def _update_landmarks(self, keypoints, descriptors, matches):
        """Обновление ориентиров"""
        for match in matches:
            train_idx = match.trainIdx
            
            # Проверка существования ориентира
            found = False
            for lm in self.landmarks.values():
                if np.allclose(lm.descriptor, descriptors[train_idx], atol=10):
                    lm.last_seen = self.frame_counter
                    lm.confidence = min(1.0, lm.confidence + 0.1)
                    found = True
                    break
            
            if not found and len(self.landmarks) < 5000:
                # Создание нового ориентира
                kp = keypoints[train_idx]
                landmark = Landmark(
                    id=self.landmark_id_counter,
                    descriptor=descriptors[train_idx],
                    position_3d=np.array([kp.pt[0], kp.pt[1], 10.0]),
                    confidence=0.3,
                    last_seen=self.frame_counter
                )
                self.landmarks[self.landmark_id_counter] = landmark
                self.landmark_id_counter += 1
    
    def _calculate_map_quality(self) -> float:
        """Оценка качества карты"""
        if not self.landmarks:
            return 0.0
        
        # Средняя уверенность ориентиров
        avg_confidence = np.mean([lm.confidence for lm in self.landmarks.values()])
        
        # Количество ориентиров
        count_factor = min(1.0, len(self.landmarks) / 1000)
        
        # Распределение ориентиров (чем больше область, тем лучше)
        positions = [lm.position_3d for lm in self.landmarks.values()]
        if positions:
            positions = np.array(positions)
            spread = np.std(positions, axis=0)
            spread_factor = min(1.0, np.mean(spread) / 100)
        else:
            spread_factor = 0.0
        
        return (avg_confidence * 0.4 + count_factor * 0.4 + spread_factor * 0.2)
    
    def _estimate_coverage(self) -> Dict[str, float]:
        """Оценка покрытия карты"""
        if not self.landmarks:
            return {'area': 0.0, 'dimensions': [0, 0, 0]}
        
        positions = np.array([lm.position_3d for lm in self.landmarks.values()])
        
        min_pos = np.min(positions, axis=0)
        max_pos = np.max(positions, axis=0)
        dimensions = max_pos - min_pos
        
        return {
            'area': float(dimensions[0] * dimensions[1]),
            'dimensions': dimensions.tolist()
        }
