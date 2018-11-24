#include <algorithm>
#include "map.h"

Map::Map() {}

bool Map::isFilled(const qint32 &x, const qint32 &y) const {
    return std::any_of(m_rects.begin(), m_rects.end(), [&](const QRect &wall) {return wall.contains(x, y);});
}
bool Map::isFilled(const QRect &r) const {
    return std::any_of(m_rects.begin(), m_rects.end(), [&](const QRect &wall) {return r.intersects(wall);});
}

void Map::fillRectangle(qint32 x1, qint32 y1, qint32 width, qint32 height) {
    m_rects.push_back(QRect(x1, y1, width, height));
}
