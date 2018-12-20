#ifndef LASER_H
#define LASER_H

#include <QQuickItem>
#include "projectile.h"

class Laser : public Projectile {
    public:
        Laser(QQuickItem *item, QVector2D position, QVector2D direction, qint32 damage, qint32 ownerId);
        ~Laser() override;
        void affect(Character *character) override;
        bool update() override;
    private:
        bool doesIntersect(QPoint b1, QPoint b2);

    private:
        QVector2D m_direction;
        QVector2D m_position;
        bool m_active = true;
        qint32 m_lifetime;
};

#endif // LASER_H
