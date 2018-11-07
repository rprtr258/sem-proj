#ifndef WEAPON_H
#define WEAPON_H

#include <QRect>
#include "observer.h"
#include "projectile.h"
#include "map.h"

class Weapon {
    public:
        virtual ~Weapon();
        virtual Projectile* shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map &m_map) = 0;
};

#endif // WEAPON_H
