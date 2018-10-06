#ifndef PLAYER_H
#define PLAYER_H

#include <QPainter>

class Player {
    public:
        Player();

        void goLeft();
        void goRight();

        void draw(QPainter *painter);
    private:
        qreal x;
        QBrush circleBrush;
        QPen circlePen;
};

#endif // PLAYER_H
