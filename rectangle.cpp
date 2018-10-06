#include "rectangle.h"

Rectangle::Rectangle() {
    top = bottom = left = right = 0;
}

void Rectangle::moveHorizontal(const int &dx) {
    left += dx;
    right += dx;
}

