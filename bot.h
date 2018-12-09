#ifndef BOT_H
#define BOT_H


#include <QObject>
#include <QQuickItem>
#include <QRect>
#include "creature.h"
#include "map.h"
#include "player.h"

class Bot : public QObject, public Creature {
    Q_OBJECT
    Q_PROPERTY(qint32 x READ x NOTIFY xChanged)
    Q_PROPERTY(qint32 y READ y NOTIFY yChanged)
    Q_PROPERTY(bool flipped READ flipped NOTIFY spriteFlipped)
    Q_PROPERTY(bool going READ going NOTIFY goingChanged)
    Q_PROPERTY(bool inAir READ inAir NOTIFY inAirChanged)
    Q_PROPERTY(qint32 health READ health NOTIFY healthChanged)
    Q_PROPERTY(qint32 mana READ mana NOTIFY manaChanged)
    Q_DISABLE_COPY(Bot)

    public:
        Bot(Map *m_map, Observer *view, QQuickItem *item, QPoint *playerPosition, QPoint botPosition, Weapon *weapon, QVector<Creature*> *updateList);
        Projectile* attack(qint32 mouseX, qint32 mouseY);
        void goLeft();
        void stopLeft();
        void goRight();
        void stopRight();
        void jump();
        void stopJump();
        bool isHeroVisible(QPoint playerCoord, QPoint botCoord);

        virtual bool update() override;

        qint32 x() const {
            return m_coord.x();
        }
        void setX(qint32 newX) {
            if (m_coord.x() == newX)
                return;
            m_coord.setX(newX);
            emit xChanged();
        }
        qint32 y() const {
            return m_coord.y();
        }
        void setY(qint32 newY) {
            if (m_coord.y() == newY)
                return;
            m_coord.setY(newY);
            emit yChanged();
        }
        bool flipped() {
            return m_spriteFlipped;
        }
        bool going() {
            return m_goingLeft xor m_goingRight;
        }
        bool inAir() {
            return m_inAir;
        }
        void setInAir(bool value) {
            if (m_inAir == value)
                return;
            m_inAir = value;
            emit inAirChanged();
        }
        qint32 health() {
            return m_health;
        }
        void setHealth(qint32 value) {
            if (m_health == value)
                return;
            m_health = value;
            emit healthChanged();
        }
        qint32 mana() {
            return m_mana;
        }

        void setMana(qint32 value) {
            if (m_mana == value)
                return;
            else {
                m_mana = std::min(value, 100);
                emit manaChanged();
            }
        }
        void setReload(qint32 value) {
            m_reload = value;
        }
    signals:
        void xChanged();
        void yChanged();
        void spriteFlipped();
        void goingChanged();
        void inAirChanged();
        void healthChanged();
        void manaChanged();
    private:
        void flipSprite() {
            m_spriteFlipped = not m_spriteFlipped;
            m_item->setProperty("mirrored", flipped());
            emit spriteFlipped();
        }
        bool isWall();
        bool canAttack();
        bool isSafePlace(QPoint playerCoord, QPoint botCoord);
        bool thereIsSafePlace(QPoint &safePlaceCoord, QPoint playerCoord, QPoint botCoord);

        void moveHorizontal(qint32 speed);
        void moveVertical(qint32 speed);
        QVector2D getHandPosition();

        void changeStandTime(qint32 value) {
            m_standTime += value;
        }

        qint32 getWidthBoundingBox() {
            return m_boundingBox.width();
        }

    private:
        QPoint *m_playerCoord;
        QPoint m_coord;
        QVector<Creature*> *m_updateList;
        Weapon *m_weapon;
        qint32 m_reload;
        qint32 m_standTime;
        //qint32 m_xCoord;
        //qint32 m_yCoord;
        qint32 m_vspeed;
        qint32 m_health;
        qint32 m_mana;
        QRect m_boundingBox;
        QQuickItem *m_item;
        Map *m_map;
        Observer *m_view;
        bool m_goingLeft;
        bool m_goingRight;
        bool m_jumping;
        bool m_spriteFlipped;
        bool goingChangingNotified = true;
        bool m_inAir = true;
};

#endif // BOT_H
