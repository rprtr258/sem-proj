#ifndef PROJECTILE_H
#define PROJECTILE_H

#include <QQuickItem>
#include "creature.h"
#include "map.h"

class Projectile : public Creature {
    public:
        Projectile(QQuickItem *item, Map *map, qint32 damage, qint32 ownerId);
    protected:
        QQuickItem *m_item = nullptr;
        Map *m_map = nullptr;
        qint32 m_damage;
        qint32 m_ownerId;
};

#endif // PROJECTILE_H
