#ifndef GUN_H
#define GUN_H

#include "weapon.h"
#include "bullet.h"

class Gun : public Weapon {
    public:
        Bullet* shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map) override;

        qint32 getMana() override {
            return m_mana;
        }
    private:
        const qint32 m_damage = 1;
        const qint32 m_mana = 30;
};

#endif // GUN_H
