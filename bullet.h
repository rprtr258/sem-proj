#ifndef BULLET_H
#define BULLET_H

#include <QQuickItem>

#include "projectile.h"

class Bullet : public Projectile {
    public:
        Bullet(QQuickItem *item, QVector2D direction, Map &map);
        virtual ~Bullet() override;
        virtual bool update() override;
        virtual qint32 getDamage() override;
        virtual qint32 getMana() override;
    private:
        QQuickItem* m_item = nullptr;
        QVector2D m_direction;
        QVector2D m_position;
        qint32 const damage = 1;
        qint32 const mana = 1;
        Map *m_map;
};

#endif // BULLET_H
