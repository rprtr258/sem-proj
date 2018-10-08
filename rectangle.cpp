#include "rectangle.h"

Rectangle::Rectangle() {
    top = bottom = left = right = 0;
}

void Rectangle::moveHorizontal(const int &dx) {
    left += dx;
    right += dx;
}

void Rectangle::moveVertical(const int &dy) {
    top += dy;
    bottom += dy;
}

