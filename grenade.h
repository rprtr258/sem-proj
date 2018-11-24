#ifndef GRENADE_H
#define GRENADE_H

#include <QQuickItem>
#include "projectile.h"

class Grenade : public Projectile {
    public:
        Grenade(QQuickItem *item, QVector2D mouseCoord, QVector2D playerCoord, Map &map);
        virtual ~Grenade() override;
        virtual bool update() override;
        virtual qint32 getDamage() override;
        virtual qint32 getMana() override;
        void setSpeed(QVector2D speed);
    private:
        QQuickItem* m_item = nullptr;
        QVector2D m_mouseCoord;
        QVector2D m_playerCoord;
        QVector2D m_position;
        QVector2D m_speed;
        qint32 const damage = 1;
        qint32 const mana = 1;
        float const dt = 0.3;
        float const g = 10;
        Map *m_map;
};

#endif // GRENADE_H
