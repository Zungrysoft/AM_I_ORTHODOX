export const WHITE = [1.0, 1.0, 1.0];
export const RED_ERROR = [1.0, 0.0, 0.0];
export const YELLOW_SELECTED = [1.0, 1.0, 0.0];
export const YELLOW_HIGHLIGHTED = [1.0, 1.0, 0.41];
export const GREY_OBTAINED = [0.55, 0.55, 0.55];
export const BLUE_LOCKED = [0.39, 0.39, 1.0];
export const PINK_LOCKED = [0.81, 0.27, 0.27];
export const ORANGE_LOCKED = [1.0, 0.31, 0];
export const GREEN_HINT = [0.26, 1.0, 0.27];

export const getLockedColor = (type) => {
    if (type === 2) {
        return ORANGE_LOCKED;
    }
    else if (type) {
        return PINK_LOCKED;
    }
    return BLUE_LOCKED;
}
