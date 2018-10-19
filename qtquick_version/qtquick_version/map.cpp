#include "map.h"

Map::Map() {}

bool Map::isFilled(const qint32 &x, const qint32 &y) const {
    for (const QRect &r : m_rects)
        if (r.left() < x and x < r.right() and r.top() < y and y < r.bottom())
            return true;
    return false;
}
#include <QDebug>
bool Map::isFilled(const QRect &r) const {
    for (const QRect &wall : m_rects) {
        if (r.left()   < wall.right() and
            r.right()  > wall.left() and
            r.top()    < wall.bottom() and
            r.bottom() > wall.top())
            return true;
    }
    return false;
}

void Map::fillRectangle(qint32 x1, qint32 y1, qint32 x2, qint32 y2) {
    m_rects.push_back(QRect(x1, y1, x2, y2));
}
