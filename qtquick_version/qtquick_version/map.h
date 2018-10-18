#ifndef MAP_H
#define MAP_H

#include "rectangle.h"
#include <vector>

class Map {
    public:
        Map();
        bool isFilled(const qint32 &x, const qint32 &y) const;
        bool isFilled(const MyRectangle &r) const;
        void fillRectangle(qint32 x1, qint32 y1, qint32 x2, qint32 y2);
    private:
        std::vector<MyRectangle> m_rects;
};

#endif // MAP_H
