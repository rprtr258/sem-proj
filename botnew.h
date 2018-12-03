#ifndef BOTNEW_H
#define BOTNEW_H

#include "creature.h"
#include <QObject>
#include <QState>


class BotNew :  public QObject, public Creature
{
public:

    BotNew();
    virtual bool update() override;
};

#endif // BOTNEW_H
