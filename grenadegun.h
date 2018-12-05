#ifndef GRENADEGUN_H
#define GRENADEGUN_H

#include "weapon.h"
#include "grenade.h"

class GrenadeGun : public Weapon {
    public:
        Grenade* shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map) override;

        qint32 getMana() override {
            return m_mana;
        }
    private:
        const qint32 m_damage = 1;
        const qint32 m_mana = 1;
};

#endif // GRENADEGUN_H
