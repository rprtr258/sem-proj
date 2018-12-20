#ifndef PLAYER_H
#define PLAYER_H

#include "character.h"

class Player : public QObject, public Character {
    Q_OBJECT
    Q_DISABLE_COPY(Player)

    public:
        Player(Map *map, Bridge *view, QQuickItem *item, QPoint position);
        QPoint *getPosition() {
            return &m_coord;
        }
};

#endif // PLAYER_H
