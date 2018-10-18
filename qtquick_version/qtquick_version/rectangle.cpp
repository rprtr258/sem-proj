#include "rectangle.h"

MyRectangle::MyRectangle() {
    m_top = m_bottom = m_left = m_right = 0;
}

MyRectangle::MyRectangle(const qint32 &_left, const qint32 &_top, const qint32 &_right, const qint32 &_bottom) {
    m_left = _left;
    m_top = _top;
    m_right = _right;
    m_bottom = _bottom;
}

void MyRectangle::moveHorizontal(const qint32 &dx) {
    m_left += dx;
    m_right += dx;
}

void MyRectangle::moveVertical(const qint32 &dy) {
    m_top += dy;
    m_bottom += dy;
}
