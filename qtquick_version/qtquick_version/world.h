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
        void keyPressEvent(qint32 key);
        void keyReleaseEvent(qint32 key);
        Player* getPlayer() {
            return m_player;
        }

    private:
        Player *m_player;
        Map m_map;
        QMap<int, bool> m_keyPressMap;
};

#endif // WORLD_H
