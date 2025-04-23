export const RED_ERROR = 'sepia(1) invert(1) saturate(100%) hue-rotate(120deg) brightness(30)';
export const YELLOW_SELECTED = 'brightness(0) invert(1) sepia(1) saturate(50) hue-rotate(0deg)';
export const YELLOW_HIGHLIGHTED = 'brightness(0) invert(1) sepia(1) saturate(10) hue-rotate(0deg)';
export const GREY_OBTAINED = 'brightness(0.55)';
export const BLUE_LOCKED = 'sepia(1) invert(1) saturate(40%) hue-rotate(0deg) brightness(100)';
export const PINK_LOCKED = 'sepia(1) invert(1) hue-rotate(120deg) brightness(3000000%) saturate(30%) brightness(180%)';
export const ORANGE_LOCKED = 'brightness(0) invert(1) sepia(1) saturate(50) hue-rotate(300deg) saturate(10)';
export const GREEN_HINT = 'brightness(0) invert(1) sepia(1) saturate(50) hue-rotate(50deg)';

export const getLockedColor = (type) => {
    if (type === 2) {
        return ORANGE_LOCKED;
    }
    else if (type) {
        return PINK_LOCKED;
    }
    return BLUE_LOCKED;
}
