#ifndef BULLET_H
#define BULLET_H

#include <QQuickItem>
#include "map.h"
#include "projectile.h"

class Bullet : public Projectile {
    public:
        Bullet(QQuickItem *item, QVector2D direction, Map *map, qint32 damage, qint32 ownerId);
        ~Bullet() override;
        void affect(Character *character) override;
        bool update() override;
    private:
        bool m_hit = false;
        QVector2D m_direction;
        QVector2D m_position;
};

#endif // BULLET_H
