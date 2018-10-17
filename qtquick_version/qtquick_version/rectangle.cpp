#include "rectangle.h"

MyRectangle::MyRectangle() {
    top = bottom = left = right = 0;
}

MyRectangle::MyRectangle(const int &_left, const int &_top, const int &_right, const int &_bottom) {
    left = _left;
    top = _top;
    right = _right;
    bottom = _bottom;
}

void MyRectangle::moveHorizontal(const int &dx) {
    left += dx;
    right += dx;
}

void MyRectangle::moveVertical(const int &dy) {
    top += dy;
    bottom += dy;
}
