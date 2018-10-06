#include "map.h"

Map::Map() {

}

bool Map::isFilled(int x, int y) {
    for (unsigned int i = 0; i < x1s.size(); i++)
        if (x1s[i] <= x and x <= x2s[i] and y1s[i] <= y and y <= y2s[i])
            return true;
    return false;
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
    for (unsigned int i = 0; i < x1s.size(); i++)
        painter->drawRect(x1s[i], y1s[i], x2s[i] - x1s[i], y2s[i] - y1s[i]);
}
