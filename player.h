#ifndef PLAYER_H
#define PLAYER_H

#include "map.h"
#include "rectangle.h"

#include <QPainter>

class Player {
    public:
        Player(Map &map);

        void goLeft();
        void stopLeft();
        void goRight();
        void stopRight();

        void update();

        void draw(QPainter *painter);
    private:
        void flipSprite();
        void moveHorizontal(int speed);
    private:
        int x;
        int y;
        Rectangle boundingBox;
        QPixmap sprite;
        Map *map;
        bool goingLeft;
        bool goingRight;
        bool spriteFlipped;
};

#endif // PLAYER_H
