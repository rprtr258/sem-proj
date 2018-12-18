#ifndef LASER_H
#define LASER_H

#include <QQuickItem>
#include "projectile.h"

class Laser : public Projectile {
    public:
        Laser(QQuickItem *item, QVector2D direction, qint32 damage, qint32 ownerId);
        ~Laser() override;
        bool update() override;
    private:
        QVector2D m_direction;
        QVector2D m_position;
        qint32 m_lifetime;
};

#endif // LASER_H
