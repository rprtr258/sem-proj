#ifndef PLAYER_H
#define PLAYER_H

#include <QPainter>

class Player {
    public:
        Player(Map &map);

        void goLeft();
        void goRight();

        void update();

        void draw(QPainter *painter);
    private:
        qint32 x;
        qint32 y;
        Rectangle boundingBox;
        QPixmap sprite;
        Map *map;
};

#endif // PLAYER_H
