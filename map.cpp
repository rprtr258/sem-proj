#include "map.h"

Map::Map() {
    brush.setColor(QColor(247, 247, 247));
}

bool Map::isFilled(const int &x, const int &y) const {
    for (const MyRectangle &r : rects)
        if (r.left < x and x < r.right and r.top < y and y < r.bottom)
            return true;
    return false;
}

bool Map::isFilled(const MyRectangle &r) const {
    for (const MyRectangle &wall : rects)
        if (r.left   < wall.right and
            r.right  > wall.left and
            r.top    < wall.bottom and
            r.bottom > wall.top)
            return true;
    return false;
}

void Map::fillRectangle(int x1, int y1, int x2, int y2) {
    if (x1 > x2)
        std::swap(x1, x2);
    if (y1 > y2)
        std::swap(y1, y2);
    rects.push_back(MyRectangle(x1, y1, x2, y2));
}

void Map::draw(QPainter *painter) {
    painter->setBrush(brush);
    for (const MyRectangle &r : rects)
        painter->drawRect(r.left, r.top, r.right - r.left, r.bottom - r.top);
}
