#ifndef PROJECTILE_H
#define PROJECTILE_H

#include "creature.h"
#include "map.h"
#include <QObject>

class Projectile : public Creature {
    public:
    virtual ~Projectile();
    virtual qint32 getDamage() = 0;
    virtual qint32 getMana() = 0;
};

#endif // PROJECTILE_H
