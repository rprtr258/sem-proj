#ifndef WORLD_H
#define WORLD_H

#include "map.h"
#include "player.h"

#include <QKeyEvent>
#include <QMap>

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
        QMap<int, bool> isKeyPressed;
};

#endif // WORLD_H
