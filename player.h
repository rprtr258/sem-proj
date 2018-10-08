#ifndef PLAYER_H
#define PLAYER_H

#include "map.h"
#include "rectangle.h"

#include <QPainter>

class Player {
    public:
        Player(Map &map);

        void goLeft();
        void goRight();

        void update();

        void draw(QPainter *painter);
    private:
        int x;
        int y;
        Rectangle boundingBox;
        QPixmap sprite;
        Map *map;
};

#endif // PLAYER_H
