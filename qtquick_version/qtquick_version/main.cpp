#include <QApplication>
#include "mainwidget.h"

qint32 main(qint32 argc, char *argv[]) {
    QApplication app(argc, argv);

    MainWidget mainWidget;
    mainWidget.show();

    return app.exec();
}
