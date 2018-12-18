#ifndef PROJECTILE_H
#define PROJECTILE_H

#include <QQuickItem>
#include "creature.h"
#include "map.h"

class Projectile : public Creature {
    public:
        Projectile(QQuickItem *item, Map *map, qint32 damage);
        void affect(Character *character) override;
    protected:
        qint32 m_damage;
        QQuickItem *m_item = nullptr;
        Map *m_map = nullptr;
};

#endif // PROJECTILE_H
