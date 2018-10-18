#ifndef PLAYER_H
#define PLAYER_H

#include <QObject>
#include "map.h"

class Player : public QObject {
    Q_OBJECT
    Q_PROPERTY(int x READ getX WRITE setX NOTIFY xChanged)
    Q_PROPERTY(int y READ getY WRITE setY NOTIFY yChanged)

    public:
        Player(Map &map);
        void goLeft();
        void stopLeft();
        void goRight();
        void stopRight();
        void jump();
        void stopJump();

        void update();

        int getX() const {
            return x;
        }
        void setX(int _x) {
            if (x == _x)
                return;
            x = _x;
            emit xChanged();
        }
        int getY() const {
            return y;
        }
        void setY(int _y) {
            if (y == _y)
                return;
            y = _y;
            emit yChanged();
        }
signals:
        void xChanged();
        void yChanged();

private:
        void flipSprite();
        void moveHorizontal(int speed);
        void moveVertical(int speed);
    private:
        int x;
        int y;
        int vspeed;
        MyRectangle boundingBox;
        Map *map;
        bool goingLeft;
        bool goingRight;
        bool jumping;
        bool spriteFlipped;
};

#endif // PLAYER_H
