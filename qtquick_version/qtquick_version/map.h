#ifndef MAP_H
#define MAP_H

#include "rectangle.h"
#include <vector>

class Map {
    public:
        Map();
        bool isFilled(const int &x, const int &y) const;
        bool isFilled(const MyRectangle &r) const;
        void fillRectangle(int x1, int y1, int x2, int y2);
    private:
        std::vector<MyRectangle> rects;
};

#endif // MAP_H
