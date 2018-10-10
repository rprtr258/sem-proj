#ifndef WORLD_H
#define WORLD_H

#include "map.h"
#include "player.h"

#include <QKeyEvent>

class World {
    public:
        World();
        ~World();

        void keyPressEvent(QKeyEvent *event);
        void keyReleaseEvent(QKeyEvent *event);
        void update();

        void draw(QPainter *painter);
    private:
        Player *player;
        Map map;
};

#endif // WORLD_H
