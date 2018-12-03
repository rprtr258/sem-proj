#ifndef WORLD_H
#define WORLD_H

#include <QMap>
#include "bot.h"
#include "map.h"
#include "observer.h"
#include "player.h"

class World {
    Q_DISABLE_COPY(World)
    public:
        World(Observer *view);
        ~World();
        void update();
        void keyPressEvent(qint32 key);
        void keyReleaseEvent(qint32 key);
        void click(qint32 mouseX, qint32 mouseY);
        Player* getPlayer() {
            return m_player;
        }
    private:
        Observer *m_view;
        Player *m_player = nullptr;
        Bot *m_bot = nullptr;
        Map m_map;
        QMap<int, bool> isKeyPressed;
        QVector<Creature*> m_updateList;
};

#endif // WORLD_H
