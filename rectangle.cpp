#include "rectangle.h"

Rectangle::Rectangle() {
    top = bottom = left = right = 0;
}

Rectangle::Rectangle(const int &_left, const int &_top, const int &_right, const int &_bottom) {
    left = _left;
    top = _top;
    right = _right;
    bottom = _bottom;
}

void Rectangle::moveHorizontal(const int &dx) {
    left += dx;
    right += dx;
}

void Rectangle::moveVertical(const int &dy) {
    top += dy;
    bottom += dy;
}

