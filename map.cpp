#include "map.h"

Map::Map() {
    brush.setColor(QColor(247, 247, 247));
}

bool Map::isFilled(const int &x, const int &y) const {
    for (unsigned int i = 0; i < x1s.size(); i++)
        if (x1s[i] < x and x < x2s[i] and y1s[i] < y and y < y2s[i])
            return true;
    return false;
}

bool Map::isFilled(const Rectangle &r) const {
    return isFilled(r.left, r.top) or
           isFilled(r.right, r.top) or
           isFilled(r.left, r.bottom) or
           isFilled(r.right, r.bottom);
}

void Map::fillRectangle(int x1, int y1, int x2, int y2) {
    if (x1 > x2)
        std::swap(x1, x2);
    if (y1 > y2)
        std::swap(y1, y2);
    x1s.push_back(x1);
    y1s.push_back(y1);
    x2s.push_back(x2);
    y2s.push_back(y2);
}

void Map::draw(QPainter *painter) {
    painter->setBrush(brush);
    for (unsigned int i = 0; i < x1s.size(); i++)
        painter->drawRect(x1s[i], y1s[i], x2s[i] - x1s[i], y2s[i] - y1s[i]);
}
