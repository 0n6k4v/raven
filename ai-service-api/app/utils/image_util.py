import cv2
import numpy as np
from typing import Any

def crop_mask_on_white(img: np.ndarray, mask: np.ndarray) -> np.ndarray:
    if mask.shape != img.shape[:2]:
        mask = cv2.resize(mask.astype(np.uint8), (img.shape[1], img.shape[0]), interpolation=cv2.INTER_NEAREST)

    white_bg = np.ones_like(img) * 255
    mask_bool = mask.astype(bool)

    for c in range(3):
        white_bg[:, :, c][mask_bool] = img[:, :, c][mask_bool]
    return white_bg