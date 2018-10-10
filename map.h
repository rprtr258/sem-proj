#ifndef MAP_H
#define MAP_H

#include "rectangle.h"

#include <QPainter>

class Map {
    public:
        Map();
        bool isFilled(const int &x, const int &y) const;
        bool isFilled(const Rectangle &r) const;
        void fillRectangle(int x1, int y1, int x2, int y2);

        void draw(QPainter *painter);
    private:
        QBrush brush;
        std::vector<Rectangle> rects;
};

#endif // MAP_H
