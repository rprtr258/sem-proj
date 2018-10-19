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
        void jump();
        void stopJump();

        void update();

        void draw(QPainter *painter);
    private:
        void flipSprite();
        void moveHorizontal(int speed);
        void moveVertical(int speed);
    private:
        int vspeed;
        qint32 x;
        qint32 y;
        Rectangle boundingBox;
        QPixmap sprite;
        Map *map;
        bool goingLeft;
        bool goingRight;
        bool jumping;
        bool spriteFlipped;
};

#endif // PLAYER_H
