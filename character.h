#ifndef CHARACTER_H
#define CHARACTER_H

#include <QObject>
#include <QQuickItem>
#include <QRect>
#include "creature.h"
#include "map.h"
#include "observer.h"
#include "projectile.h"
#include "weapon.h"

class Character : public Creature {
    public:
        Character(Map *map, Observer *view, QQuickItem *item, QPoint position);
        virtual ~Character() override;

        virtual void goLeft();
        virtual void stopLeft();
        virtual void goRight();
        virtual void stopRight();
        virtual void jump();
        virtual void stopJump();
        virtual void changeWeapon();
        virtual void attack(qint32 mouseX, qint32 mouseY);

        virtual void hit(qint32 value);
        virtual void setMana(qint32 value) {
            m_mana = value;
        }
        virtual bool flipped() {
            return m_spriteFlipped;
        }

        virtual bool update() override;
    protected:
        virtual void flipSprite() {
            m_spriteFlipped = not m_spriteFlipped;
        }
        virtual void moveHorizontal(qint32 speed);
        virtual void moveVertical(qint32 speed);
        virtual QVector2D getHandPosition();
    protected:
        QPoint m_coord;
        qint32 m_vspeed;
        qint32 m_health;
        qint32 m_mana;
        qint32 m_reload;
        QRect m_boundingBox;
        QQuickItem *m_item;
        Map *m_map;
        Observer *m_view;
        Weapon *m_weapon;
        qint32 m_weaponType;
        bool m_goingLeft;
        bool m_goingRight;
        bool m_jumping;
        bool m_spriteFlipped;
        bool m_inAir = true;
};

#endif // CHARACTER_H
