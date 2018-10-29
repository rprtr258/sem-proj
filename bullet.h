#ifndef BULLET_H
#define BULLET_H

#include <QQuickItem>

#include "creature.h"

class Bullet : public Creature {
    public:
        Bullet(QQuickItem *item, QVector2D direction);
        virtual ~Bullet();

        virtual bool update() override;
    private:
        QQuickItem *m_item = nullptr;
        QVector2D m_direction;
        QVector2D m_position;
};

#endif // BULLET_H
