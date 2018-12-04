#include "bot.h"
#include <QVariant>
#include <iostream>
#include <QStateMachine>
#include "statemachine.h"

//QStateMachine machine;
//QState *activeAttack = new QState;
//QState *activeGoingLeft = new QState;
//QState *activeGoingRight = new QState;
//QState *activeSafePlaceStand = new QState;
//QState *activeSafePlaceGoingLeft = new QState;
//QState *activeSafePlaceGoingRight = new QState;
//QState *respawn = new QState;
//QState *active = new QState;
//QState *activeGoing = new QState;
//QState *activeSafePlace = new QState;

qint32 newSign(const qint32 &x) {
    return (x > 0) - (x < 0);
}

Bot::Bot(Map *worldMap, Observer *view, QQuickItem *item, QPoint *playerPosition, QPoint botPosition, Weapon *weapon,QVector<Creature*> *updateList) {
    m_item = item;
    m_health = 100;
    m_mana = 100;
    m_reload = 0;
    m_goingLeft = m_goingRight = false;
    m_vspeed = 0;
    m_map = worldMap;
    m_boundingBox = QRect(botPosition.x(), botPosition.y(), 55, 95);
    m_spriteFlipped = false;
    m_weapon = weapon;
    m_view = view;
    m_coord = QPoint(botPosition.x(), botPosition.y());
    m_playerCoord = playerPosition;
    m_updateList = updateList;
    m_standTime = 20;
}

void Bot::goLeft() {
    if (not m_goingLeft) {
        m_goingLeft = true;
        goingChangingNotified = false;
    }
}

void Bot::stopLeft() {
    m_goingLeft = false;
    goingChangingNotified = false;
}

void Bot::goRight() {
    if (not m_goingRight) {
        m_goingRight = true;
        goingChangingNotified = false;
    }
}

void Bot::stopRight() {
    m_goingRight = false;
    goingChangingNotified = false;
}

void Bot::jump() {
    m_jumping = true;
}

void Bot::stopJump() {
    m_jumping = false;
}

bool isInScreen(QVector2D point) {
    const qint32 topScreenX = 640;
    const qint32 bottomScreenX = 0;
    const qint32 topScreenY = 480;
    const qint32 bottomScreenY = 0;
    return point.x() >= bottomScreenX && point.x() <= topScreenX &&
            point.y() >= bottomScreenY && point.y() <= topScreenY;
}

bool isInPlayerBoundingBox(QPoint playerCoord, QVector2D point) {
    return point.x() >= playerCoord.x() && point.x() <= playerCoord.x() + 55 &&
            point.y() >= playerCoord.y() && point.y() <= playerCoord.y() + 95;
}

bool Bot::isHeroVisible(QPoint playerPosition, QPoint botPosition) {
    QVector2D botCoord = QVector2D(botPosition.x(), botPosition.y());
    QVector2D playerCoord = QVector2D(playerPosition.x(), playerPosition.y());
    QVector2D direction = (playerCoord - botCoord).normalized();
    QVector2D position = botCoord;
    while (!m_map->isFilled(position.toPoint()) && isInScreen(position)) {
        position += direction;
        if (isInPlayerBoundingBox(playerPosition, position)) {
            return true;
        }
    }

    return false;
}

bool Bot::isWall() {
    QRect boundingBox = QRect(m_boundingBox.x() - 1, m_boundingBox.y() - 1, m_boundingBox.width() + 2, m_boundingBox.height());
    return m_map->isFilled(boundingBox);
}

/*bool Bot::thereIsSafePlace(QPoint safePlaceCoord, QPoint m_playerCoord, QPoint botCoord) {
    QPoint leftPoint = botCoord;
    QPoint rightPoint = botCoord;

    while(not(m_map->isFilled(QRect(leftPoint.x() - 1.0, leftPoint.y(), 1.0, 10.0)) && m_map->isFilled(QRect(rightPoint.x() + 1, rightPoint.y(), 1, 10)))) {
        leftPoint.setX(leftPoint.x() - 5);
        rightPoint.setX(rightPoint.x() + 5);
        if (isSafePlace(leftPoint, m_playerCoord)) {
            safePlaceCoord = leftPoint;
            return true;
        }

        if (isSafePlace(rightPoint, m_playerCoord)) {
            safePlaceCoord = rightPoint;
            return true;
        }
    }

    return false;
}*/

bool Bot::isSafePlace(QPoint playerCoord, QPoint botCoord) {
    return !isHeroVisible(botCoord, playerCoord);
}

bool Bot::canAttack() {
    return isHeroVisible(*m_playerCoord, m_coord) && (m_mana > 0) && (m_reload <= 0);
}

void Bot::moveHorizontal(qint32 speed) {
    qint32 dx = speed;
    qint32 delta = newSign(speed);
    QRect newRect = m_boundingBox.translated(dx, 0);
    while (m_map->isFilled(newRect) and dx != 0) {
        dx -= delta;
        newRect.translate(-delta, 0);
    }
    if (dx == 0)
        return;
    setX(m_coord.x() + dx);
    m_boundingBox.translate(dx, 0);
}

void Bot::moveVertical(qint32 speed) {
    qint32 dy = speed;
    qint32 delta = newSign(speed);
    QRect newRect = m_boundingBox.translated(0, dy);
    while (m_map->isFilled(newRect) and dy != 0) {
        dy -= delta;
        newRect.translate(0, -delta);
        m_vspeed = 0;
    }
    if (dy == 0)
        return;
    if (not inAir())
        setInAir(true);
    setY(m_coord.y() + dy);
    m_boundingBox.translate(0, dy);
}

Projectile* Bot::attack(qint32 mouseX, qint32 mouseY) {
    if (m_reload <= 0) {
        setReload(50);
        QVector2D startCoord = QVector2D(m_coord.x(), m_coord.y());
        return m_weapon->shoot(m_view, QVector2D(mouseX, mouseY), startCoord, m_map);
    }
    return nullptr;
}


enum BotState {
    Attack,
    Stand,
    GoingLeft,
    GoingRight,
    Respawn
};

static BotState state = Respawn;
static BotState lastActivity = Respawn;

bool Bot::update() {
    switch (state) {
    case(Respawn): {
        setReload(std::max(m_reload - 1, 0));
        if (m_mana <= 0) {
            state = Stand;
        }
        if (m_map->isFilled(m_boundingBox.translated(0, 1))) {
            m_inAir = false;

            flipSprite();
            m_item->setProperty("mirrored", flipped());
            state = GoingLeft;
        }

        moveVertical(10 - m_vspeed);
        m_vspeed = std::max(m_vspeed - 1, 0);

        m_item->setX(m_coord.x());
        m_item->setY(m_coord.y());

        m_item->setProperty("mirrored", flipped());
        m_item->setProperty("going", going());
        m_item->setProperty("inAir", inAir());
        m_item->setProperty("health", health());
        m_item->setProperty("mana", mana());
        if (not goingChangingNotified) {
            emit goingChanged();
            goingChangingNotified = true;
        }
        break;
    }
    case(GoingLeft): {
        setReload(std::max(m_reload - 1, 0));
        lastActivity = GoingLeft;
        if (m_mana <= 0) {
            state = Stand;
        }

        if (canAttack()) {
            state = Attack;
        }
        moveHorizontal(-5);
        m_goingLeft = true;
        m_item->setProperty("going", going());

        if (isWall()) {
            m_goingLeft = false;
            flipSprite();
            state = GoingRight;
        }

        m_item->setX(m_coord.x());
        m_item->setY(m_coord.y());
        m_item->setProperty("mirrored", flipped());
        if (not goingChangingNotified) {
            emit goingChanged();
            goingChangingNotified = true;
        }
        break;
    }
    case(GoingRight): {
        lastActivity = GoingRight;

        setReload(std::max(m_reload - 1, 0));

        if (m_mana <= 0) {
            state = Stand;
        }
        if (canAttack()) {
            state = Attack;
        }

        moveHorizontal(5);
        m_goingRight = true;
        m_item->setProperty("going", going());

        if (isWall()) {
            m_goingRight = false;
            flipSprite();
            state = GoingLeft;
        }

        m_item->setX(m_coord.x());
        m_item->setY(m_coord.y());
        m_item->setProperty("mirrored", flipped());
        m_item->setProperty("going", going());
        if (not goingChangingNotified) {
            emit goingChanged();
            goingChangingNotified = true;
        }

        break;
    }

    case(Attack): {
        setMana(m_mana - 30);
        m_updateList->push_back(attack(m_playerCoord->x(), m_playerCoord->y()));

        state = lastActivity;
        break;
    }

    case(Stand): {
        setMana(m_mana + 3);
        stopLeft();
        stopRight();
        m_item->setProperty("going", going());

        while (m_standTime > 0) {
            changeStandTime(-1);
        }

        if (canAttack()) {
            state = Attack;
        } else if (m_mana == 100) {
            state = lastActivity;
        }
    }
        break;
    }
    return false;
}
