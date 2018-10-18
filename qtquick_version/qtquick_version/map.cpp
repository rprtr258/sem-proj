#include "map.h"

Map::Map() {}

bool Map::isFilled(const qint32 &x, const qint32 &y) const {
    for (const MyRectangle &r : m_rects)
        if (r.m_left < x and x < r.m_right and r.m_top < y and y < r.m_bottom)
            return true;
    return false;
}

bool Map::isFilled(const MyRectangle &r) const {
    for (const MyRectangle &wall : m_rects)
        if (r.m_left   < wall.m_right and
            r.m_right  > wall.m_left and
            r.m_top    < wall.m_bottom and
            r.m_bottom > wall.m_top)
            return true;
    return false;
}

void Map::fillRectangle(qint32 x1, qint32 y1, qint32 x2, qint32 y2) {
    if (x1 > x2)
        std::swap(x1, x2);
    if (y1 > y2)
        std::swap(y1, y2);
    m_rects.push_back(MyRectangle(x1, y1, x2, y2));
}
