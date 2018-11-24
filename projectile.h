#ifndef PROJECTILE_H
#define PROJECTILE_H

#include <QRect>
#include "creature.h"

class Projectile : public Creature {
    public:
        virtual ~Projectile() {}
        //virtual qint32 getDamage() = 0;
        //virtual bool doesHit(QRect hitBox) = 0;
};

#endif // PROJECTILE_H
