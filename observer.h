#ifndef OBSERVER_H
#define OBSERVER_H

#include <QQuickItem>

#include "creature.h"

class Observer {
    public:
        virtual ~Observer();
        virtual QQuickItem* createBullet(qint32 x, qint32 y) = 0;
        virtual QQuickItem* createLaser(QVector2D mouseCoord, QVector2D playerCoord) = 0;
        virtual QQuickItem* createGrenade(qint32 x, qint32 y) = 0;
        virtual QQuickItem* createCharacter(qint32 x, qint32 y, qint32 type) = 0;
        virtual void addCreature(Creature *creature) = 0;
};

#endif // OBSERVER_H
