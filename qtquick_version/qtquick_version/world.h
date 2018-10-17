#ifndef WORLD_H
#define WORLD_H

#include "map.h"
#include "player.h"

#include <QMap>

class World {
    public:
        World();
        ~World();
        void update();
        void keyPressEvent(int key);
        void keyReleaseEvent(int key);
        Player* getPlayer() {
            return player;
        }

    private:
        Player *player;
        Map map;
        QMap<int, bool> isKeyPressed;
};

#endif // WORLD_H
