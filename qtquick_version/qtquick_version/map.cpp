#include "map.h"

Map::Map() {}

bool Map::isFilled(const qint32 &x, const qint32 &y) const {
    for (const QRect &r : m_rects)
        if (r.contains(x, y))
            return true;
    return false;
}
#include <QDebug>
bool Map::isFilled(const QRect &r) const {
    for (const QRect &wall : m_rects) {
        if (r.intersects(wall))
            return true;
    }
    return false;
}

void Map::fillRectangle(qint32 x1, qint32 y1, qint32 x2, qint32 y2) {
    m_rects.push_back(QRect(x1, y1, x2, y2));
}
