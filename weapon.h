#ifndef WEAPON_H
#define WEAPON_H

#include "observer.h"
#include "projectile.h"
#include "map.h"

class Weapon {
    public:
        virtual ~Weapon();
        virtual void shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map *m_map, qint32 ownerId) = 0;
        virtual qint32 getManaCost() {
            return m_mana;
        }

    protected:
        qint32 const m_damage = 10;
        qint32 const m_mana = 35;
};

#endif // WEAPON_H
