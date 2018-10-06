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
        std::vector<int> x1s;
        std::vector<int> y1s;
        std::vector<int> x2s;
        std::vector<int> y2s;
};

#endif // MAP_H
